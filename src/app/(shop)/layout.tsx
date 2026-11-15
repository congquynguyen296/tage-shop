import { Header } from "@/components/layout/Header";
import { NewsletterSection } from "@/components/layout/NewsletterSection";
import { Footer } from "@/components/layout/Footer";
import { FlyToCartContainer } from "@/components/cart/FlyToCart";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 page">{children}</main>
      <NewsletterSection />
      <Footer />
      <FlyToCartContainer />
    </div>
  );
}
