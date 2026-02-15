import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListTutorials, useListProducts, useGetHeroSettings } from '../hooks/useQueries';
import { Link } from '@tanstack/react-router';
import { Play, ShoppingBag, BookOpen, Users, Music } from 'lucide-react';
import type { Tutorial } from '../types';
import type { Product } from '../backend';
import { Difficulty } from '../types';

export default function HomePage() {
  const { data: tutorials = [] } = useListTutorials();
  const { data: products = [] } = useListProducts();
  const { data: heroSettings } = useGetHeroSettings();

  const heroHeadline = heroSettings?.headline || 'Master the Ocarina';
  const heroSubheadline = heroSettings?.subheadline || 'Learn, create, and share beautiful music with our community';
  const heroImageUrl = heroSettings?.heroImage?.getDirectURL() || '/assets/generated/ocarina-hero.dim_800x600.jpg';

  const featuredTutorials = tutorials.filter(t => t.isFree).slice(0, 3);
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
        <img 
          src={heroImageUrl}
          alt="Hero" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-5xl font-bold mb-4">{heroHeadline}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            {heroSubheadline}
          </p>
          <div className="flex gap-4">
            <Link to="/learning">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Start Learning
              </Button>
            </Link>
            <Link to="/community">
              <Button size="lg" variant="outline" className="gap-2">
                <Users className="h-5 w-5" />
                Join Community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container space-y-16">
        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <BookOpen className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Interactive Tutorials</CardTitle>
              <CardDescription>
                Learn at your own pace with AI-powered guidance and feedback
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Vibrant Community</CardTitle>
              <CardDescription>
                Share your recordings and connect with fellow musicians
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ShoppingBag className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Quality Instruments</CardTitle>
              <CardDescription>
                Browse our curated selection of ocarinas and accessories
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Featured Tutorials */}
        {featuredTutorials.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold">Featured Tutorials</h2>
                <p className="text-muted-foreground">Start your learning journey</p>
              </div>
              <Link to="/learning">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center relative">
                    <Play className="h-16 w-16 text-muted-foreground" />
                    <Badge className="absolute top-2 right-2 bg-green-500">FREE</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{tutorial.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
                    <Badge variant="outline" className="w-fit mt-2">
                      {tutorial.difficulty}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold">Featured Products</h2>
                <p className="text-muted-foreground">Quality instruments for every player</p>
              </div>
              <Link to="/store">
                <Button variant="outline">View Store</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {product.images.length > 0 ? (
                      <img 
                        src={product.images[0].blob.getDirectURL()} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                    <div className="text-2xl font-bold text-primary pt-2">
                      ${(Number(product.price) / 100).toFixed(2)}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
