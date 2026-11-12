import React, { useEffect, useState } from 'react';
import { ConnectAppLayout } from './ConnectAppLayout';
import { CommunityView } from './views/CommunityView';
import { MessagesView } from './views/MessagesView';
import { DiscoverView } from './views/DiscoverView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { CreatePostModal } from './CreatePostModal';
import { CommentsDrawer } from './CommentsDrawer';
import { ReportModal } from './ReportModal';
import { useConnectStore } from '../store/useConnectStore';
import { ConnectPost, ConnectTabType } from '../types/connect.types';

interface ConnectAppProps {
  onNavigateToTicket?: (from: string, to: string) => void;
  defaultTab?: ConnectTabType;
}

export const ConnectApp: React.FC<ConnectAppProps> = ({
  onNavigateToTicket,
  defaultTab,
}) => {
  const {
    posts,
    activeTab,
    categoryFilter,
    searchQuery,
    savedPostIds,
    activePost,
    isLoading,
    isSubmitting,
    setActiveTab,
    setCategoryFilter,
    setSearchQuery,
    setActivePost,
    toggleSavePost,
    createPost,
    likePost,
    deletePost,
    reportPost,
    addComment,
    initConnect,
  } = useConnectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reportingPost, setReportingPost] = useState<ConnectPost | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, setActiveTab]);

  useEffect(() => {
    const unsub = initConnect();
    return () => unsub();
  }, [initConnect]);

  return (
    <ConnectAppLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onOpenCreateModal={() => setShowCreateModal(true)}
      unreadCount={1}
    >
      {/* ── APP VIEWS (Community / Feed is Primary) ── */}
      {(activeTab === 'community' || activeTab === 'home') && (
        <CommunityView
          posts={posts}
          savedPostIds={savedPostIds}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          isLoading={isLoading}
          onSetCategoryFilter={setCategoryFilter}
          onSetSearchQuery={setSearchQuery}
          onOpenCreateModal={() => setShowCreateModal(true)}
          onLike={likePost}
          onToggleSave={toggleSavePost}
          onOpenComments={setActivePost}
          onDeletePost={deletePost}
          onReportPost={setReportingPost}
          onNavigateToBooking={onNavigateToTicket}
        />
      )}

      {activeTab === 'discover' && (
        <DiscoverView
          posts={posts}
          savedPostIds={savedPostIds}
          onLike={likePost}
          onToggleSave={toggleSavePost}
          onOpenComments={setActivePost}
          onNavigateToBooking={onNavigateToTicket}
        />
      )}

      {activeTab === 'messages' && <MessagesView />}

      {activeTab === 'notifications' && <NotificationsView />}

      {activeTab === 'profile' && (
        <ProfileView
          posts={posts}
          savedPostIds={savedPostIds}
          onLike={likePost}
          onToggleSave={toggleSavePost}
          onOpenComments={setActivePost}
          onDeletePost={deletePost}
          onNavigateToBooking={onNavigateToTicket}
        />
      )}

      {/* ── MODALS & DRAWERS ── */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createPost}
        isSubmitting={isSubmitting}
      />

      <CommentsDrawer
        post={activePost}
        onClose={() => setActivePost(null)}
        onAddComment={addComment}
      />

      <ReportModal
        post={reportingPost}
        onClose={() => setReportingPost(null)}
        onSubmit={reportPost}
      />
    </ConnectAppLayout>
  );
};

export default ConnectApp;

