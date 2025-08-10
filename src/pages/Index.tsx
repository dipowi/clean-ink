import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "WELCOME TO SUSU.MY.ID";
    const desc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    desc.setAttribute('name', 'description');
    desc.setAttribute('content', 'WELCOME TO SUSU.MY.ID — halaman sederhana, cepat, dan bersih.');
    if (!desc.parentNode) document.head.appendChild(desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sr-only">
        <h1>WELCOME TO SUSU.MY.ID</h1>
      </header>
      <main className="min-h-screen flex items-center justify-center">
        <section className="max-w-2xl mx-auto px-6">
          <div className="border border-border rounded-lg p-10 bg-card/50">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">WELCOME TO SUSU.MY.ID</h2>
            <p className="text-muted-foreground leading-relaxed">
              Halaman depan yang bersih dan profesional. Tidak ada tautan—cukup sapaan hangat. Selamat membaca.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
