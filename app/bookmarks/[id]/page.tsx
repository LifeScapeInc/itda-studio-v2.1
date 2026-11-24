import { BookmarksWorkspace } from "@/components/bookmarks/bookmarks-workspace";
export default async function BookmarkDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 return <BookmarksWorkspace detailId={id} />;
}
