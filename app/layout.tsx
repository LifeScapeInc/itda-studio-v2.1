import type { Metadata } from "next";
import { ProjectStoreHydration } from "@/components/projects/project-store-hydration";
import { StyledComponentsRegistry } from "@/system/styles/styled-components-registry";
import "./globals.css";
export const metadata: Metadata = {
  title: "ITDA Studio v2.1",
  description: "ITDA 관리자 고객 의뢰 케이스 가져오기"
};
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('itda-studio-v2.1:theme');
                  document.documentElement.classList.toggle('dark', theme !== 'light');
                  document.documentElement.classList.toggle('light', theme === 'light');
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <StyledComponentsRegistry>
          <ProjectStoreHydration />
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
