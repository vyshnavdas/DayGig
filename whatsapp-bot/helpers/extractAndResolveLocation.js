require("dotenv").config();

const axios = require("axios");

const extractLocationText =
  require("../llm/extractLocationText");

// ============================================
// SIMPLE MEMORY CACHE
// ============================================

const geocodeCache =
  new Map();

// ============================================
// MAIN FUNCTION
// ============================================

async function extractAndResolveLocation(
  rawMessage
) {
  // ============================================
  // EXTRACT URLS
  // ============================================

  const urlRegex =
    /(https?:\/\/[^\s]+)/g;

  const urls =
    rawMessage.match(urlRegex) || [];

  // ============================================
  // FIND GOOGLE MAPS URL
  // ============================================

  const mapUrl = urls.find(
    (url) =>
      url.includes(
        "google.com/maps"
      ) ||
      url.includes(
        "maps.app.goo.gl"
      )
  );

  // ============================================
  // CASE 1:
  // MAP URL EXISTS
  // ============================================

  if (mapUrl) {
    try {
      const response =
        await axios.get(
          mapUrl,
          {
            maxRedirects: 5,

            headers: {
              "User-Agent":
                "Mozilla/5.0",
            },
          }
        );

      const finalUrl =
        response.request.res
          .responseUrl;

      let lat = null;
      let lng = null;

      // ============================================
      // @LAT,LNG
      // ============================================

      let match =
        finalUrl.match(
          /@(-?\d+\.\d+),(-?\d+\.\d+)/
        );

      // ============================================
      // ?q=LAT,LNG
      // ============================================

      if (!match) {
        match =
          finalUrl.match(
            /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/
          );
      }

      // ============================================
      // /place/LAT,LNG
      // ============================================

      if (!match) {
        match =
          finalUrl.match(
            /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/
          );
      }

      // ============================================
      // PARSE COORDINATES
      // ============================================

      if (match) {
        lat = parseFloat(
          match[1]
        );

        lng = parseFloat(
          match[2]
        );
      }

      // ============================================
      // RETURN
      // ============================================

      return {
        has_map_link: true,

        map_url:
          mapUrl,

        resolved_url:
          finalUrl,

        location_source:
          "google_maps",

        location_text:
          null,

        formatted_address:
          null,

        coordinates:
          lat && lng
            ? {
                lat,
                lng,
              }
            : null,
      };
    } catch (err) {
      console.error(
        "[MAP ERROR]",
        err.message
      );

      return {
        has_map_link: true,

        map_url:
          mapUrl,

        coordinates:
          null,

        error:
          err.message,
      };
    }
  }

  // ============================================
  // CASE 2:
  // NO MAP URL
  // ============================================

  try {
    // ============================================
    // LOCATION EXTRACTION LLM
    // ============================================

    const locationText =
      await extractLocationText(
        rawMessage
      );

    // ============================================
    // NO LOCATION FOUND
    // ============================================

    if (!locationText) {
      return {
        has_map_link:
          false,

        location_text:
          null,

        coordinates:
          null,
      };
    }

    // ============================================
    // BUILD QUERY
    // ============================================

    const query =
      `${locationText}, Ernakulam, Kerala, India`;

    // ============================================
    // CACHE HIT
    // ============================================

    if (
      geocodeCache.has(
        query
      )
    ) {
      console.log(
        "[CACHE HIT]",
        query
      );

      return geocodeCache.get(
        query
      );
    }

    // ============================================
    // GOOGLE GEOCODING API
    // ============================================

    const geoResponse =
      await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address:
              query,

            language:
              "en",

            key:
              process.env
                .GOOGLE_MAPS_API_KEY,
          },
        }
      );

    const result =
      geoResponse.data
        ?.results?.[0];

    // ============================================
    // NO RESULT
    // ============================================

    if (!result) {
      return {
        has_map_link:
          false,

        location_text:
          locationText,

        coordinates:
          null,
      };
    }

    // ============================================
    // FINAL RESULT
    // ============================================

    const finalResult = {
      has_map_link:
        false,

      location_text:
        locationText,

      formatted_address:
        result.formatted_address,

      location_source:
        "google_geocoder",

      coordinates: {
        lat:
          result.geometry
            .location.lat,

        lng:
          result.geometry
            .location.lng,
      },
    };

    // ============================================
    // SAVE CACHE
    // ============================================

    geocodeCache.set(
      query,
      finalResult
    );

    // ============================================
    // RETURN
    // ============================================

    return finalResult;
  } catch (err) {
    console.error(
      "[LOCATION ERROR]",
      err.response?.data ||
        err.message
    );

    return {
      has_map_link:
        false,

      location_text:
        null,

      coordinates:
        null,

      error:
        err.message,
    };
  }
}

module.exports =
  extractAndResolveLocation;