import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  disableMetaPixel,
  initializeMetaPixel,
  loadPublicMetaPixelSettings,
  trackMetaPageView,
} from "../utils/metaPixel";

const MetaPixelTracker = () => {
  const location = useLocation();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let active = true;
    const loadSettings = () => {
      loadPublicMetaPixelSettings()
        .then((pixelSettings) => {
          if (active) setSettings(pixelSettings);
        })
        .catch((error) => {
          console.error("Could not load public Meta Pixel settings.", error);
        });
    };

    loadSettings();
    window.addEventListener("meta-pixel-config-updated", loadSettings);
    return () => {
      active = false;
      window.removeEventListener("meta-pixel-config-updated", loadSettings);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    if (!settings.enabled || location.pathname === "/admin") {
      disableMetaPixel();
      return;
    }
    initializeMetaPixel(settings.pixelId);
    trackMetaPageView();
  }, [location.pathname, settings]);

  return null;
};

export default MetaPixelTracker;
