import "./globals.css";
import type {Metadata} from "next";
export const metadata:Metadata={title:"SolidTrust Finance | Building Trust. Growing Wealth.",description:"A calm, transparent financial home for everyday savers and small borrowers."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}