import {FiTrendingUp} from 'react-icons/fi';

export default function Brand({compact = false}) {
    return <span className="spendwise-brand"><span className="spendwise-symbol" aria-hidden="true"><FiTrendingUp /></span>{!compact && <span>spendwise<span className="brand-dot">.</span></span>}</span>;
}
