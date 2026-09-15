import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export const EthiopicFont = () => {
  const [handle] = useState(() => delayRender("load-ethiopic-font"));

  useEffect(() => {
    const font = new FontFace(
      "Noto Sans Ethiopic",
      `url(${staticFile("assets/fonts/NotoSansEthiopic-Regular.ttf")})`,
      { weight: "400" },
    );

    void font
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        continueRender(handle);
      })
      .catch((error: unknown) => {
        console.error(error);
        continueRender(handle);
      });
  }, [handle]);

  return null;
};
