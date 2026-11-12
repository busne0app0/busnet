import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import type { ConnectPost, ConnectTabType } from '../types/connect.types';

interface ConnectAppProps {
  onNavigateToTicket?: (from: string, to: string) => void;
  defaultTab?: ConnectTabType;
}

const CONNECT_TAB_VALUES = new Set<string>([
  'community',
  'home',
  'discover',
  'messages',
  'notifications',
  'profile',
]);

const isConnectTabType = (value: string | null): value is ConnectTabType =>
  value !== null && CONNECT_TAB_VALUES.has(value);

export const ConnectApp: React.FC<ConnectAppProps> = ({
  onNavigateToTicket,
  defaultTab,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawUrlTab = searchParams.get('tab');
  const urlTab = isConnectTabType(rawUrlTab) ? rawUrlTab : null;
  const previousRawUrlTabRef = useRef(rawUrlTab);
  const previousDefaultTabRef = useRef(defaultTab);
  const isInitialTabSyncRef = useRef(true);

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
    const previousRawUrlTab = previousRawUrlTabRef.current;
    const rawUrlTabChanged = previousRawUrlTab !== rawUrlTab;
    const defaultTabChanged = previousDefaultTabRef.current !== defaultTab;
    const isInitialSync = isInitialTabSyncRef.current;

    previousRawUrlTabRef.current = rawUrlTab;
    previousDefaultTabRef.current = defaultTab;
    isInitialTabSyncRef.current = false;

    if (urlTab) {
      setActiveTab(urlTab);
      return;
    }

    if (isInitialSync) {
      if (defaultTab) {
        setActiveTab(defaultTab);
      } else if (rawUrlTab !== null) {
        setActiveTab('community');
      }
      return;
    }

    if (rawUrlTabChanged) {
      setActiveTab(defaultTab && rawUrlTab !== null ? defaultTab : 'community');
      return;
    }

    if (defaultTabChanged && !urlTab) {
      if (defaultTab) {
        setActiveTab(defaultTab);
      } else if (rawUrlTab !== null) {
        setActiveTab('community');
      }
    }
  }, [defaultTab, rawUrlTab, setActiveTab, urlTab]);

  const handleSelectTab = (tab: ConnectTabType) => {
    setActiveTab(tab);

    const nextSearchParams = new URLSearchParams(searchParams);
    if (tab === 'community') {
      nextSearchParams.delete('tab');
    } else {
      nextSearchParams.set('tab', tab);
    }

    setSearchParams(nextSearchParams);
  };

  useEffect(() => {
    const unsubscribe = initConnect();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initConnect]);

  return (
    <ConnectAppLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onOpenCreateModal={() => setShowCreateModal(true)}
      unreadCount={0}
    >
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
