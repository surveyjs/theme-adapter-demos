"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  surveyAdapterHref,
  surveyOverridesHref,
  SURVEY_OVERRIDES_SHARED_HREF,
} from "@/lib/surveyAdapterCss";
import {
  type VisualStyleId,
} from "@/lib/styles";

export default function ThemeLayout({
  children,
  theme,
}: {
  children: ReactNode;
  theme: VisualStyleId
}) {
  const adapterRef = useRef<HTMLLinkElement>(null);
  const overridesRef = useRef<HTMLLinkElement>(null);
  const [isReady, setIsReady] = useState(true);
  const linkCounter = useRef(0);
  const onLoad = () => {
    linkCounter.current++;
    if (linkCounter.current > 1) {
      setIsReady(true);
    }
  };
  useLayoutEffect(() => {
    setIsReady(false);
    linkCounter.current = 0;
    for (const link of [adapterRef, overridesRef]) {
      if (Array.from(document.styleSheets).some((sheet) => {
        return sheet.href === link.current?.href;
      })) {
        onLoad();
      }
    }
  }, [theme])

  return (
    <>
      <link rel="stylesheet" href={surveyAdapterHref(theme)} ref={adapterRef} onLoad={onLoad} />
      <link rel="stylesheet" href={SURVEY_OVERRIDES_SHARED_HREF} />
      <link rel="stylesheet" href={surveyOverridesHref(theme)} ref={overridesRef} onLoad={onLoad} />
      {isReady ? children : null}
    </>
  );
}
