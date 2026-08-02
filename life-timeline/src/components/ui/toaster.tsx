import { useEffect, useState } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

/** 跟随站点 .dark 类的 Sonner Toaster（监听 html class 变化） */
export function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return <SonnerToaster theme={theme} position="top-center" richColors {...props} />;
}
