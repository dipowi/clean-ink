import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArticleCard } from "@/components/ArticleCard";
import { supabase } from "@/integrations/supabase/client";
import { PenTool } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_name?: string;
  created_at: string;
  view_count: number;
}

const Index = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setArticles(data || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Telegraph</h1>
              <p className="text-muted-foreground mt-1">Simple publishing platform</p>
            </div>
            <Button asChild>
              <Link to="/post" className="flex items-center gap-2">
                <PenTool className="w-4 h-4" />
                Write Article
              </Link>
            </Button>
          </div>
        </header>

        {/* Articles */}
        <main>
          {articles.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-xl font-semibold mb-4">No articles yet</h2>
              <p className="text-muted-foreground mb-6">
                Be the first to share your story
              </p>
              <Button asChild>
                <Link to="/post">Create First Article</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for content creators
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
