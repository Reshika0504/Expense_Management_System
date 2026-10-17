import {Link} from 'react-router-dom';
import {FiArrowUpRight, FiArrowDownLeft, FiArrowRight, FiCheck, FiHeart, FiStar, FiCoffee, FiShoppingBag} from 'react-icons/fi';

const bars = [42, 68, 51, 85, 61, 94, 73];
export default function Hero() {
    return <section className="landing-hero">
        <div className="landing-orb landing-orb-blue" /><div className="landing-orb landing-orb-pink" />
        <div className="landing-hero-inner">
            <div className="landing-hero-copy">
                <span className="landing-badge"><FiStar /> SMALL HABITS. BIG POSSIBILITIES.</span>
                <h1>Your money,<br />looking <span className="gradient-word">brighter.</span></h1>
                <p>A little less “where did it go?” A little more peace of mind. Make room for the things you love with a clear view of your spending, budgets and savings.</p>
                <div className="landing-hero-actions">
                    <Link to="/register" className="landing-btn landing-btn-primary landing-btn-lg">Create your space <FiArrowRight /></Link>
                    <Link to="/login" className="landing-text-link">Already have an account? <span>Sign in ↗</span></Link>
                </div>
                <div className="landing-chip-row"><span><FiCheck /> Free to get started</span><span><FiCheck /> Google or email sign-in</span></div>
            </div>
            <div className="landing-hero-visual" aria-label="Illustrative example of Spendwise with sample financial data">
                <div className="preview-float preview-float-top"><span className="preview-heart"><FiHeart /></span><div>A little closer to your goals<strong>Every small step counts.</strong></div></div>
                <div className="money-preview">
                    <div className="preview-heading"><span>YOUR MONTH, AT A GLANCE</span><span className="preview-dots">•••</span></div>
                    <div className="preview-balance"><span>Available balance</span><strong>₹23,550<span>.00</span></strong><span className="preview-balance-note">A brighter picture of your money <FiStar /></span></div>
                    <div className="preview-summary"><div><span className="preview-icon"><FiArrowDownLeft /></span><span>Income<strong>₹42,000</strong></span></div><div><span className="preview-icon pink"><FiArrowUpRight /></span><span>Expenses<strong>₹18,450</strong></span></div></div>
                    <div className="preview-chart-heading"><strong>A little progress, every day</strong><span>This week ↗</span></div>
                    <div className="preview-bars" aria-hidden="true">{bars.map((height, i) => <div key={i}><span style={{height: `${height}%`}} /><small>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</small></div>)}</div>
                    <div className="preview-recent"><span className="preview-icon peach"><FiCoffee /></span><span>Something lovely<strong>Coffee & a catch-up</strong></span><b>− ₹240</b></div>
                    <div className="preview-recent"><span className="preview-icon pink"><FiShoppingBag /></span><span>A little treat<strong>Weekend finds</strong></span><b>− ₹1,200</b></div>
                </div>
                <div className="preview-float preview-float-bottom"><span className="goal-spark"><FiStar /></span><div>Savings goal<strong>Dream trip fund</strong><span className="preview-goal-track"><span /></span></div><b>72%</b></div>
                <p className="preview-caption">A little peek inside · illustrative sample data</p>
            </div>
        </div>
    </section>;
}
