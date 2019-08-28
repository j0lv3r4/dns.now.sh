import axios from "axios";
import qs from "qs";
import { isAbsolute } from "path";

async function handleSubmit(
  event,
  regions,
  setRegions,
  domainInfo,
  setDisabled
) {
  event.preventDefault();

  let authNameservers = [];

  // First request to get the authoritative nameserver

  try {
    console.log("Making request");
    const authResponse = await axios({
      url: "https://arn1-dnscheck.now.sh/authoritative_nameserver",
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        domain: domainInfo.domain
      })
    });

    if (authResponse.status === 200) {
      authNameservers = authResponse.data.message;
      console.log("auth nameservers", authNameservers);
    }
  } catch (err) {
    console.error("Error while trying to get the Auth NS", err);
  }

  regions.forEach(async ({ id }, index) => {
    const isAuthoritative = index === 0;

    setRegions(currentRegions =>
      currentRegions.map(region => {
        if (region.id === id) {
          return {
            ...region,
            loading: true,
            error: "",
            data: []
          };
        }

        return region;
      })
    );

    try {
      const url = `https://${id}-dnscheck.now.sh`;

      const response = await axios({
        url: isAuthoritative ? "https://arn1-dnscheck.now.sh" : url,
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: qs.stringify({
          domain: domainInfo.domain,
          dns_server: isAuthoritative
            ? authNameservers[0]
            : domainInfo.dnsServer
        })
      });

      if (response.status === 200) {
        setRegions(currentRegions =>
          currentRegions.map(region => {
            if (region.id === id) {
              return {
                ...region,
                loading: false,
                data: response.data.data
              };
            }

            return region;
          })
        );
      }

      setDisabled(false);
    } catch (err) {
      setDisabled(false);
      console.log("err!", err);

      if (err.response) {
        setRegions(currentRegions =>
          currentRegions.map(region => {
            if (region.id === id) {
              return {
                ...region,
                loading: false,
                error: err.response.data.message
              };
            }

            return region;
          })
        );
      } else {
        console.error(err);
      }
    }
  });
}

export { handleSubmit };
