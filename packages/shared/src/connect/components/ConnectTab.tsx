"use client";

import React, { useEffect, useState } from 'react';
import { ConnectNavbar } from './ConnectNavbar';
import { HomeView } from './views/HomeView';
import { CommunityView } from './views/CommunityView';
import { MessagesView } from './views/MessagesView';
import { GroupsView } from './views/GroupsView';
import { DiscoverView } from './views/DiscoverView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { CreatePostModal } from './CreatePostModal';
import { CommentsDrawer } from './CommentsDrawer';
import { ReportModal } from './ReportModal';
import { useConnectStore } from '../store/useConnectStore';
import type { ConnectPost, ConnectTabType } from '../types/connect.types';

interface ConnectTabProps {
  onNavigateToTicket?: (from: string, to: string) => void;
  defaultTab?: ConnectTabType;
}

export const ConnectTab: React.FC<ConnectTabProps> = ({
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
    <div className="flex min-h-[calc(100dvh-120px)] w-full flex-col bg-[#070b14] text-slate-100">
      {/* 7-Section Navigation Bar */}
      <ConnectNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}

      />

      {/* Main Content Area */}
      <main aria-busy={isLoading} className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === 'home' && (
          <HomeView
            posts={posts}
            savedPostIds={savedPostIds}
            onSelectTab={setActiveTab}
            onOpenCreateModal={() => setShowCreateModal(true)}
            onLike={likePost}
            onToggleSave={toggleSavePost}
            onOpenComments={setActivePost}
            onNavigateToBooking={onNavigateToTicket}
          />
        )}

        {activeTab === 'community' && (
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

        {activeTab === 'messages' && <MessagesView />}

        {activeTab === 'groups' && <GroupsView />}

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
      </main>

      {/* Modals & Drawers */}
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
    </div>
  );
};
