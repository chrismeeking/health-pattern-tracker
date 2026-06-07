import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/hooks/useAppData';
import { ThemeProvider } from '@/hooks/useTheme';
import { AppLayout } from '@/components/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { MealsPage } from '@/pages/MealsPage';
import { AddPage } from '@/pages/AddPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { ProfileSettingsPage } from '@/pages/ProfileSettingsPage';
import { AddMealPage, EditMealPage } from '@/pages/MealFormPage';
import { AddWaterPage } from '@/pages/AddWaterPage';
import { AddWeightPage } from '@/pages/AddWeightPage';
import { HealthPage } from '@/pages/HealthPage';
import { CreateGoalPage, EditGoalPage } from '@/pages/GoalFormPage';
import { IssuesPage } from '@/pages/IssuesPage';
import { CreateIssuePage, EditIssuePage } from '@/pages/IssueFormPage';
import { LogSymptomPage } from '@/pages/LogSymptomPage';
import { DailyCheckInPage } from '@/pages/DailyCheckInPage';
import { CreateFavouritePage, EditFavouritePage } from '@/pages/FavouriteFormPage';
import { FavouritesPage } from '@/pages/FavouritesPage';
import { SavedFoodsPage } from '@/pages/SavedFoodsPage';
import { ScanBarcodePage } from '@/pages/ScanBarcodePage';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/meals" element={<MealsPage />} />
              <Route path="/meals/:id/edit" element={<EditMealPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/issues/:id/edit" element={<EditIssuePage />} />
              <Route path="/add" element={<AddPage />} />
              <Route path="/add/meal" element={<AddMealPage />} />
              <Route path="/add/meal/scan" element={<ScanBarcodePage />} />
              <Route path="/favourites" element={<FavouritesPage />} />
              <Route path="/favourites/new" element={<CreateFavouritePage />} />
              <Route path="/favourites/:id/edit" element={<EditFavouritePage />} />
              <Route path="/saved-foods" element={<SavedFoodsPage />} />
              <Route path="/add/weight" element={<AddWeightPage />} />
              <Route path="/add/water" element={<AddWaterPage />} />
              <Route path="/add/symptom" element={<LogSymptomPage />} />
              <Route path="/add/check-in" element={<DailyCheckInPage />} />
              <Route path="/add/issue" element={<CreateIssuePage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/health/goals/new" element={<CreateGoalPage />} />
              <Route path="/health/goals/:id/edit" element={<EditGoalPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/profile" element={<ProfileSettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
