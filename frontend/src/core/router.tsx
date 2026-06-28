import { Route, Routes } from 'react-router-dom';
import { HomePage } from '../features/home/HomePage';
import { InterceptPage } from '../features/intercept/InterceptPage';
import { JournalPage } from '../features/journal/JournalPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { InsightPage } from '../features/insight/InsightPage';
import { ReportPage } from '../features/report/ReportPage';
import { DecidePage } from '../features/decide/DecidePage';

// 路由配置
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/intercept" element={<InterceptPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/insight" element={<InsightPage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/decide" element={<DecidePage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
