import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bot, Code, Combine, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons/logo';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');
  const featureImage1 = PlaceHolderImages.find((img) => img.id === 'feature-image-1');
  const featureImage2 = PlaceHolderImages.find((img) => img.id === 'feature-image-2');
  const featureImage3 = PlaceHolderImages.find((img) => img.id === 'feature-image-3');

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-accent" />,
      title: 'AI-Powered Code Editor',
      description:
        'Enhance your workflow with AI-driven code completion, inline suggestions, and a conversational assistant.',
      image: featureImage1,
    },
    {
      icon: <Search className="h-8 w-8 text-accent" />,
      title: 'Ecosystem Research Workbench',
      description:
        'Utilize powerful tools and visualizations to analyze code editor ecosystems, market trends, and platform governance.',
      image: featureImage2,
    },
    {
      icon: <Combine className="h-8 w-8 text-accent" />,
      title: 'Extensible Plugin Marketplace',
      description:
        'Customize your experience by browsing, installing, and managing a wide range of community-built extensions.',
      image: featureImage3,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline">MyCodeXvantaOS Studio</span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight font-headline lg:text-5xl">
              The Next Evolution of Code Intelligence
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              MyCodeXvantaOS Studio is an open, extensible platform for developers and researchers
              to build, analyze, and collaborate on the future of code editing.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Launch Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#">View Documentation</Link>
              </Button>
            </div>
          </div>
          {heroImage && (
            <div className="relative mx-auto mt-8 w-full max-w-6xl rounded-xl border shadow-xl shadow-primary/10">
              <div className="absolute inset-0 -z-10 bg-primary/5 blur-3xl"></div>
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                width={1200}
                height={675}
                className="rounded-lg"
                data-ai-hint={heroImage.imageHint}
                priority
              />
            </div>
          )}
        </section>

        <section id="features" className="container space-y-12 py-12 sm:py-24">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tighter font-headline md:text-4xl">
              A Unified Development & Research Hub
            </h2>
            <p className="max-w-[700px] text-muted-foreground">
              From writing production-grade code to conducting deep market analysis, our integrated
              toolset has you covered.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="max-w-sm overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardHeader className="p-0">
                  {feature.image && (
                    <Image
                      src={feature.image.imageUrl}
                      alt={feature.image.description}
                      width={600}
                      height={400}
                      className="aspect-video w-full object-cover"
                      data-ai-hint={feature.image.imageHint}
                    />
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    {feature.icon}
                    <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                  </div>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MyCodeXvantaOS Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Code className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">An Open Source Initiative.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
