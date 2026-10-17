import {Link} from 'react-router-dom';
import {FiStar, FiHeart, FiArrowUpRight} from 'react-icons/fi';
import Brand from '../Brand';

export default function AuthVisual() {
    return <section className="auth-visual">
        <Link to="/" className="auth-brand-link" aria-label="Spendwise home"><Brand /></Link>
        <div className="auth-story">
            <span className="auth-story-eyebrow"><FiStar /> YOUR NEXT CHAPTER, A LITTLE BRIGHTER.</span>
            <h2>Less money worry.<br />More <em>possibility.</em></h2>
            <p>A home for your everyday expenses and your someday dreams. Let's make room for both.</p>
            <div className="auth-goal-preview" aria-label="Illustrative savings goal preview">
                <span className="auth-goal-icon"><FiHeart /></span><span>A little dream, in progress<strong>My next adventure</strong></span><FiArrowUpRight />
                <div className="progress-track"><div className="progress-fill" style={{width: '72%'}} /></div>
                <small>72% of a little dream · sample preview</small>
            </div>
        </div>
        <p className="auth-visual-footer">Small habits. Brighter days. A space that's yours.</p>
    </section>;
}
