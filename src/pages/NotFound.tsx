import { Link } from 'react-router-dom';
import { Empty } from '@/components/ui';

export default function NotFound() {
  return <Empty title="Page not found" action={<Link className="btn btn-primary" to="/">Go home</Link>}>That address does not exist in this app.</Empty>;
}
