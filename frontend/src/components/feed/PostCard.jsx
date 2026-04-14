import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, Trash2, MoreHorizontal } from 'lucide-react';
import './PostCard.css';

const PostCard = ({ post, onLike, onDelete, currentUserId }) => {
  return (
    <div className="post-card glass animate-fade-up">
      <div className="post-header">
        <div className="user-info">
          <img src={post.user?.profilePicture || 'https://via.placeholder.com/50'} alt="Avatar" className="Avatar" />
          <div>
            <h4>{post.user?.name || 'Unknown Creative'}</h4>
            <p>{post.user?.role || 'Film Professional'} • {new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="post-actions">
          {post.userId == currentUserId && (
            <button onClick={() => onDelete(post.id)} className="delete-btn">
              <Trash2 size={18} />
            </button>
          )}
          <button className="more-btn"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="post-body">
        <p>{post.content}</p>
        
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className={`post-images-grid images-${Math.min(post.imageUrls.length, 4)}`}>
            {post.imageUrls.map((url, idx) => (
              <img key={idx} src={url} alt={`Post clip ${idx + 1}`} className="post-img" />
            ))}
          </div>
        )}

        {post.externalLinks && post.externalLinks.length > 0 && (
          <div className="post-links">
            {post.externalLinks.map((link, idx) => (
              <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="post-link-attachment">
                <Share2 size={14} /> {new URL(link).hostname}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="post-footer">
        <button className={`action-btn ${post.liked ? 'liked' : ''}`} onClick={() => onLike(post.id)}>
          <Heart size={18} fill={post.liked ? "currentColor" : "none"} />
          <span>{post.likes || 0}</span>
        </button>
        <button className="action-btn">
          <MessageSquare size={18} />
          <span>{post.comments || 0}</span>
        </button>
        <button className="action-btn">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
