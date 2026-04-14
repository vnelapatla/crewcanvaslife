import React, { useState, useEffect } from 'react';
import { Video, GraduationCap, Trophy, Clapperboard, Plus, X, MapPin, Calendar, Clock, Image as ImageIcon } from 'lucide-react';
import './EventsPage.css';

const API_BASE_URL = window.location.origin;

const EventsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [formData, setFormData] = useState({
    title: '', location: '', startDate: '', endDate: '', timeDuration: '',
    capacity: '', price: '', orgName: '',
    orgPhone: '', orgEmail: '',
    skills: '', description: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const eventTypes = [
    { icon: <Video size={20} />, title: 'AUDITIONS', type: 'Audition', color: 'blue' },
    { icon: <Clapperboard size={20} />, title: 'WORKSHOPS', type: 'Workshop', color: 'pink' },
    { icon: <GraduationCap size={20} />, title: 'COURSES', type: 'Course', color: 'green' },
    { icon: <Trophy size={20} />, title: 'CONTESTS', type: 'Contest', color: 'gold' },
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTabChange = (type) => {
    setActiveTab(type);
    if (type === 'ALL') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.eventType === type));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Login required');
      return;
    }

    const eventData = {
      ...formData,
      userId: parseInt(userId),
      eventType: selectedType,
      date: formData.startDate // Compatibility for backend @JsonProperty("date")
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        setShowModal(false);
        setSelectedType(null);
        fetchEvents();
      } else {
        const error = await response.text();
        alert('Error: ' + error);
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedType(null);
  };

  const getCount = (type) => events.filter(e => e.eventType === type).length;

  return (
    <div className="events-page">
      <div className="events-banner">
        <div className="banner-content">
            <h1>Industry Opportunities</h1>
            <p>Connect with the best creators and build your cinematic career</p>
        </div>
      </div>

      <div className="events-grid-menu">
        <div className={`event-type-card ${activeTab === 'ALL' ? 'active' : ''}`}
             onClick={() => handleTabChange('ALL')}>
             <div className="event-info">
              <h3>ALL EVENTS</h3>
              <p>Everything</p>
            </div>
            <div className="event-count">{events.length}</div>
        </div>
        {eventTypes.map((type) => (
          <div key={type.type} 
               className={`event-type-card ${activeTab === type.type ? 'active' : ''}`}
               onClick={() => handleTabChange(type.type)}>
            <div className={`event-icon-wrapper ${type.color}`}>
              {type.icon}
            </div>
            <div className="event-info">
              <h3>{type.title}</h3>
            </div>
            <div className="event-count">{getCount(type.type)}</div>
          </div>
        ))}
      </div>

      <div className="events-list-container">
        <div className="events-display-grid">
            {filteredEvents.map(event => (
                <div key={event.id} className="cinematic-event-card">
                    <div className="card-image">
                        <span className={`event-tag ${event.eventType?.toLowerCase()}`}>{event.eventType}</span>
                        <img src={event.imageUrl || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800"} alt="Event" />
                    </div>
                    <div className="card-body">
                        <h3>{event.title}</h3>
                        <div className="meta-stats">
                            <span><Calendar size={14} /> {event.date || event.startDate}</span>
                            <span><MapPin size={14} /> {event.location}</span>
                        </div>
                        <p className="description">{event.description}</p>
                        <div className="card-footer">
                            <span className="applicants"><span>{event.applicants || 0}</span> Applied</span>
                            <button className="apply-now-btn">Apply Now</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <button className="create-fab" onClick={() => setShowModal(true)}>
        <Plus size={32} />
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className={`modal-window ${selectedType ? 'form-mode' : 'choice-mode'}`} onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h2>{selectedType ? `Launch ${selectedType}` : 'Create New Opportunity'}</h2>
              <X className="close-icon" onClick={handleClose} />
            </div>
            
            {!selectedType ? (
              <div className="choice-grid">
                {eventTypes.map((opt) => (
                  <div key={opt.type} className="choice-card" onClick={() => setSelectedType(opt.type)}>
                    <div className={`icon-circle ${opt.color}`}>
                      {opt.icon}
                    </div>
                    <span>{opt.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <form className="event-form" onSubmit={handleSubmit}>
                <div className="form-rows">
                  <div className="input-group full">
                    <label>Opportunity Title</label>
                    <input name="title" placeholder="Event Title" required onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Start Date</label>
                    <input name="startDate" type="date" required onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>End Date</label>
                    <input name="endDate" type="date" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Time Duration</label>
                    <input name="timeDuration" placeholder="e.g. 9AM - 5PM" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Location</label>
                    <input name="location" placeholder="City or Studio" required onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Organizer Name</label>
                    <input name="orgName" placeholder="Enter Name" onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Organizer Email</label>
                    <input name="orgEmail" type="email" placeholder="email@example.com" onChange={handleInputChange} />
                  </div>
                  <div className="input-group full">
                    <label>Description & Requirements</label>
                    <textarea name="description" placeholder="Provide full details..." required onChange={handleInputChange} />
                  </div>
                </div>
                <button type="submit" className="submit-event-btn">Launch Now</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
