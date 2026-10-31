import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './Layout';

const BookHome = lazy(() => import('@/features/book/BookHome'));
const ReagentsHome = lazy(() => import('@/features/reagents/ReagentsHome'));
const CalcHome = lazy(() => import('@/features/calc/CalcHome'));
const ProgressHome = lazy(() => import('@/features/progress/ProgressHome'));
const About = lazy(() => import('@/features/about/About'));
// Dev-only route; the ternary lets the production build drop the chunk entirely.
const Debug = import.meta.env.DEV ? lazy(() => import('@/features/debug/Debug')) : null;

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/calc" replace />} />
          <Route path="book/*" element={<BookHome />} />
          <Route path="reagents/*" element={<ReagentsHome />} />
          <Route path="calc/*" element={<CalcHome />} />
          <Route path="progress" element={<ProgressHome />} />
          <Route path="about" element={<About />} />
          {Debug && <Route path="debug" element={<Debug />} />}
          <Route path="*" element={<Navigate to="/calc" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
