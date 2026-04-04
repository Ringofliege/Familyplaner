import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useFamilyState } from './hooks/useFamilyState';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { TodayPage } from './pages/Today';
import { CalendarPage } from './pages/Calendar';
import { TasksPage } from './pages/Tasks';
import { MealsPage } from './pages/Meals';
import { FamilyPage } from './pages/Family';
import { AdminPage } from './pages/Admin';

export function App() {
  const {
    state,
    completeTask,
    addTask,
    updateTask,
    deleteTask,
    setMealPlan,
    removeMealPlan,
    toggleStressMode,
    sendThankYou,
    takeOverTask,
    switchUser,
    addShopItem,
    deleteShopItem,
    redeemShopItem,
  } = useFamilyState();

  return (
    <BrowserRouter>
      <div className="app-shell flex min-h-[100dvh] flex-col bg-transparent">
        <Header
          currentUser={state.currentUser}
          onSwitchUser={switchUser}
          stressMode={state.stressMode.active}
        />

        <main className="relative z-10 flex-1 overflow-y-auto pb-24">
          <Routes>
            <Route
              path="/"
              element={
                <TodayPage
                  state={state}
                  completeTask={completeTask}
                  takeOverTask={takeOverTask}
                  sendThankYou={sendThankYou}
                  toggleStressMode={toggleStressMode}
                />
              }
            />
            <Route
              path="/calendar"
              element={<CalendarPage state={state} />}
            />
            <Route
              path="/tasks"
              element={
                <TasksPage
                  state={state}
                  completeTask={completeTask}
                  addTask={addTask}
                  updateTask={updateTask}
                  deleteTask={deleteTask}
                  takeOverTask={takeOverTask}
                  sendThankYou={sendThankYou}
                />
              }
            />
            <Route
              path="/meals"
              element={
                <MealsPage
                  state={state}
                  setMealPlan={setMealPlan}
                  removeMealPlan={removeMealPlan}
                />
              }
            />
            <Route
              path="/family"
              element={
                <FamilyPage
                  state={state}
                  toggleStressMode={toggleStressMode}
                  switchUser={switchUser}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminPage
                  state={state}
                  addTask={addTask}
                  updateTask={updateTask}
                  deleteTask={deleteTask}
                  addShopItem={addShopItem}
                  deleteShopItem={deleteShopItem}
                  redeemShopItem={redeemShopItem}
                />
              }
            />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
