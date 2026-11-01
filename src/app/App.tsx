import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './Layout';

const Home = lazy(() => import('@/features/home/Home'));
const BookHome = lazy(() => import('@/features/book/BookHome'));
const ReagentsHome = lazy(() => import('@/features/reagents/ReagentsHome'));
const CalcHome = lazy(() => import('@/features/calc/CalcHome'));
const ProgressHome = lazy(() => import('@/features/progress/ProgressHome'));
const About = lazy(() => import('@/features/about/About'));
const Inbox = lazy(() => import('@/features/feedback/Inbox'));
// Dev-only routes; the ternary lets the production build drop the chunk entirely.
const Debug = import.meta.env.DEV ? lazy(() => import('@/features/debug/Debug')) : null;
const Review = import.meta.env.DEV ? lazy(() => import('@/features/review/Review')) : null;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="book/*" element={<BookHome />} />
          <Route path="reagents/*" element={<ReagentsHome />} />
          <Route path="calc/*" element={<CalcHome />} />
          <Route path="progress" element={<ProgressHome />} />
          <Route path="about" element={<About />} />
          {/* Private: your suggestions inbox (password-protected by the Worker). */}
          <Route path="inbox" element={<Inbox />} />
          {Debug && <Route path="debug" element={<Debug />} />}
          {Review && <Route path="review" element={<Review />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
