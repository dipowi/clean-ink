import { Link } from "react-router-dom";

interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_name?: string;
  created_at: string;
  view_count: number;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = article.content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .substring(0, 150) + "...";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <Link 
      to={`/${article.slug}`}
      className="block p-6 border-b border-border hover:bg-muted/30 transition-colors"
    >
      <h2 className="text-xl font-semibold mb-2 text-foreground hover:text-primary transition-colors">
        {article.title}
      </h2>
      <p className="text-muted-foreground mb-3 leading-relaxed">
        {excerpt}
      </p>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{formatDate(article.created_at)}</span>
        {article.author_name && <span>by {article.author_name}</span>}
        <span>{article.view_count} views</span>
      </div>
    </Link>
  );
}