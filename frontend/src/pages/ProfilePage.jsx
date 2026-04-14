import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Bell, MapPin, Mail, Phone, ChevronDown, Heart, MessageSquare, ExternalLink } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');
    const displayUserId = userId || currentUserId;

    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchPosts();
    }, [displayUserId]);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`/api/profile/${displayUserId}`);
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await fetch(`/api/posts/user/${displayUserId}`);
            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setLoading(false);
        }
    };

    if (!user && !loading) return <div className="profile-error">User not found</div>;

    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
        <div className="profile-page-container">
            {/* Top Navigation Wrapper */}
            <div className="react-profile-header-wrap">
                <div className="banner-overlay-blur"></div>
                <header className="react-top-nav">
                    <div className="react-search-box">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search for crew, projects..." />
                    </div>

                    <div className="header-actions-right">
                        <button className="react-notify-btn">
                            <Bell size={20} />
                        </button>
                        <div className="react-user-pill" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <div className="pill-avatar">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="" />
                                ) : (
                                    <span>{initials.substring(0, 2)}</span>
                                )}
                            </div>
                            <span className="pill-name">{user?.name?.toLowerCase() || 'user'}</span>
                            <ChevronDown size={14} />
                            
                            {isDropdownOpen && (
                                <div className="react-dropdown-menu">
                                    <div className="dropdown-item" onClick={() => navigate('/profile')}>👤 My Profile</div>
                                    <div className="dropdown-item">⚙️ Settings</div>
                                    <div className="dropdown-item logout" onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}>↪️ Logout</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            </div>

            <main className="react-profile-split">
                {/* Left Column: Dark Side */}
                <div className="profile-dark-col">
                    <div className="stars-layer"></div>
                    
                    <div className="avatar-glow-container">
                        <div className="glow-ring"></div>
                        <div className="main-avatar-box">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={user.name} />
                            ) : (
                                <div className="avatar-initial-big">{initials.substring(0, 1)}</div>
                            )}
                        </div>
                    </div>

                    <div className="profile-title-block">
                        <h1>{user?.name || 'Loading...'}</h1>
                        <p className="role-tagline">{user?.role?.toLowerCase() || 'director'}</p>
                        <div className="location-pill">
                            <MapPin size={14} color="#4dc" />
                            <span>{user?.location?.toUpperCase() || 'HYDERABAD'}</span>
                        </div>
                        {displayUserId !== currentUserId && (
                            <div className="profile-actions-row">
                                <button className="msg-btn-react" onClick={() => navigate(`/messages?userId=${displayUserId}`)}>
                                    <MessageSquare size={16} />
                                    <span>Message</span>
                                </button>
                                <button className="follow-btn-react">
                                    <Heart size={16} />
                                    <span>Follow</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="contact-list-react">
                        <div className="react-contact-pill">
                            <span className="p-label">EMAIL:</span>
                            <span className="p-value">{user?.email?.toUpperCase() || 'USER@GMAIL.COM'}</span>
                            <Mail size={16} className="p-icon" />
                        </div>
                        <div className="react-contact-pill">
                            <span className="p-label">PHONE:</span>
                            <span className="p-value">{user?.phone || '9951020428'}</span>
                            <Phone size={16} className="p-icon" />
                        </div>
                    </div>

                    <div className="bottom-brand-text">
                        sifi directors
                    </div>
                </div>

                {/* Right Column: Light Side */}
                <div className="profile-light-col">
                    <div className="section-title-wrap">
                        <h2>MOVIE PROJECTS</h2>
                    </div>

                    <div className="react-projects-grid">
                        {loading ? (
                            <div className="loading-state">Loading projects...</div>
                        ) : posts.length > 0 ? (
                            posts.map(post => (
                                <div key={post.id} className="project-card-react">
                                    <div className="card-image-wrap">
                                        <img 
                                            src={post.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000'} 
                                            alt={post.content} 
                                        />
                                        <div className="hover-overlay-react">
                                            <ExternalLink size={24} />
                                        </div>
                                    </div>
                                    <div className="card-info-react">
                                        <h3>{post.content.length > 20 ? post.content.substring(0, 20) + '...' : post.content}</h3>
                                        <p>| {user?.role || 'Director'}</p>
                                    </div>
                                    <div className="card-stats-react">
                                        <span><Heart size={14} /> {post.likes || 0}</span>
                                        <span><MessageSquare size={14} /> {post.comments || 0}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-projects">No projects found for this user.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
