"use client";

import { useCallback } from "react";

export function useProductTour() {
  const startTour = useCallback(() => {
    // Defer to let navigation settle before starting the tour
    setTimeout(async () => {
      const { driver } = await import("driver.js");
      const { tourSteps } = await import("@/lib/config/product-tour");

      const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayOpacity: 0.5,
        steps: tourSteps,
        onDestroyStarted: () => {
          driverObj.destroy();
          localStorage.setItem("tourCompleted", "true");
        },
      });

      driverObj.drive();
    }, 600);
  }, []);

  const isTourCompleted = () =>
    typeof window !== "undefined" &&
    localStorage.getItem("tourCompleted") === "true";

  return { startTour, isTourCompleted };
}
