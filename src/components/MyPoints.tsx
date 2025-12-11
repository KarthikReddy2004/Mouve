import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyPoints.css';
import { auth } from '../../firebase';

interface Points {
  reformer: number;
  mat: number;
  hot: number;
}

const MyPoints: React.FC = () => {
  const [points, setPoints] = useState<Points | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        // Mock fetching points for the logged-in user
        const mockPoints: Points = {
          reformer: 12,
          mat: 8,
          hot: 3,
        };
        setPoints(mockPoints);
      } else {
        setPoints(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  if (!user || !points) {
    return null;
  }

  return (
    <div className="my-points-widget">
      <div className="points-summary" onClick={togglePanel}>
        Reformer: {points.reformer} - Mat: {points.mat} - Hot: {points.hot}
      </div>
      {isPanelOpen && (
        <div className="points-panel">
          <h3>My Points</h3>
          <ul>
            <li>Reformer: {points.reformer}</li>
            <li>Mat: {points.mat}</li>
            <li>Hot: {points.hot}</li>
          </ul>
          <Link to="/plans" className="plans-link">View Plans</Link>
        </div>
      )}
    </div>
  );
};

export default MyPoints;
