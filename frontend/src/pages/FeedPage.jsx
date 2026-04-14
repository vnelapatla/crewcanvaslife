import React, { useState, useEffect } from 'react';
import PostCard from '../components/feed/PostCard';
import { Image as ImageIcon, Send } from 'lucide-react';
import './FeedPage.css';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState(['']);
  const [links, setLinks] = useState(['']);
  const [showAttachments, setShowAttachments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const currentUserId = localStorage.getItem('userId');

  const fetchPosts = async (pageNum = 0, isAppend = false) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?page=${pageNum}&size=10`);
      if (response.ok) {
        const data = await response.json();
        const newPosts = data.content || [];
        setPosts(prev => isAppend ? [...prev, ...newPosts] : newPosts);
        setHasMore(!data.last);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const filteredImages = imageUrls.filter(url => url.trim() !== '');
    const filteredLinks = links.filter(link => link.trim() !== '');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUserId, 
          content,
          imageUrls: filteredImages,
          externalLinks: filteredLinks
        })
      });
      if (response.ok) {
        setContent('');
        setImageUrls(['']);
        setLinks(['']);
        setShowAttachments(false);
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to post", err);
    }
  };

  const handleAddField = (setter, values) => {
    setter([...values, '']);
  };

  const handleValueChange = (setter, values, index, newValue) => {
    const updated = [...values];
    updated[index] = newValue;
    setter(updated);
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      fetchPosts();
    } catch (err) {
      console.error("Like failed", err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      fetchPosts();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="feed-page">
      <div className="feed-header">
        <h2 className="gradient-text">Community Feed</h2>
        <p>Insights from the industry creators</p>
      </div>

      <div className="create-post glass">
        <textarea 
          placeholder="What's happening in your studio?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {showAttachments && (
          <div className="attachments-section animate-fade-in">
            <div className="attachment-group">
              <label>Image URLs</label>
              {imageUrls.map((url, index) => (
                <input 
                  key={`img-${index}`}
                  type="text" 
                  placeholder="Paste image URL..." 
                  value={url}
                  onChange={(e) => handleValueChange(setImageUrls, imageUrls, index, e.target.value)}
                  className="attachment-input"
                />
              ))}
              <button className="add-more-btn" onClick={() => handleAddField(setImageUrls, imageUrls)}>+ Add Image</button>
            </div>
            
            <div className="attachment-group">
              <label>External Links</label>
              {links.map((link, index) => (
                <input 
                  key={`link-${index}`}
                  type="text" 
                  placeholder="Paste link (portfolio, script, etc)..." 
                  value={link}
                  onChange={(e) => handleValueChange(setLinks, links, index, e.target.value)}
                  className="attachment-input"
                />
              ))}
              <button className="add-more-btn" onClick={() => handleAddField(setLinks, links)}>+ Add Link</button>
            </div>
          </div>
        )}

        <div className="create-footer">
          <div className="footer-actions">
            <button 
              className={`icon-btn ${showAttachments ? 'active' : ''}`} 
              onClick={() => setShowAttachments(!showAttachments)}
              title="Add Attachments"
            >
              <ImageIcon size={20} />
            </button>
          </div>
          <button className="premium-btn" onClick={handleCreatePost} disabled={!content.trim()}>
            <Send size={18} /> Post
          </button>
        </div>
      </div>

      <div className="posts-container">
        {posts.length > 0 ? (
          <>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                onDelete={handleDelete}
                currentUserId={currentUserId}
              />
            ))}
            {hasMore && (
              <button 
                className="load-more-btn glass" 
                onClick={() => fetchPosts(page + 1, true)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Show More Masterpieces'}
              </button>
            )}
          </>
        ) : loading ? (
          <div className="loading">Loading Studio Feed...</div>
        ) : (
          <div className="empty">No posts yet. Start the conversation!</div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
