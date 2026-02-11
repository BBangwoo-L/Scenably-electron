import { Header } from "@/features/layout";
import { ToastContainer } from "@/components/toast";
import { ConfirmModalContainer } from "@/components/confirm-modal";
import { RecordingNotifier } from "@/components/recording-notifier";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <ToastContainer />
        <RecordingNotifier />
        <ConfirmModalContainer />
      </body>
    </html>
  );
}
