"use client";

import { useEffect } from "react";

const bannerStyle = `
  font-size: 44px;
  font-weight: 800;
  color: #b91c1c;
  background: #fef2f2;
  padding: 20px 28px;
  border-radius: 10px;
  border: 2px solid #b91c1c;
  line-height: 1.5;
  letter-spacing: -0.5px;
`;

const subStyle = `
  font-size: 17px;
  font-weight: 600;
  color: #7f1d1d;
  line-height: 1.6;
`;

const smallStyle = `
  font-size: 14px;
  color: #450a0a;
`;

function DevtoolWarning() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const WIDTH_THRESHOLD = 160;
    const HEIGHT_THRESHOLD = 160;

    let warned = false;

    function showWarning() {
      console.log(
        "%c⚠️  Warning! ⚠️\n\nThis console is intended for developers only.\n\nPasting code here can let attackers steal your session, account, or sensitive data. Swantara will never ask you to paste code into this console.\n\nIf someone told you to paste something here, it is likely a scam. Close this tab and report it.\n\nLearn more: https://swantara.dev/security",
        bannerStyle,
      );
      console.log("%cDo not paste anything you do not fully understand.", subStyle);
      console.log("%cStay safe online.", smallStyle);
      warned = true;
    }

    function checkDevtools() {
      const devtoolsOpen =
        window.outerWidth - window.innerWidth > WIDTH_THRESHOLD ||
        window.outerHeight - window.innerHeight > HEIGHT_THRESHOLD;

      if (devtoolsOpen && !warned) {
        showWarning();
      }

      if (!devtoolsOpen) {
        warned = false;
      }
    }

    checkDevtools();

    const interval = setInterval(checkDevtools, 800);

    return () => clearInterval(interval);
  }, []);

  return null;
}

export default DevtoolWarning;
