import { lazy } from "react";

export const Briefing = lazy(() => import("@/routes/Briefing").then((module) => ({
  default: module.Briefing
})));
export const Capture = lazy(() => import("@/routes/Capture").then((module) => ({
  default: module.Capture
})));
export const Entities = lazy(() => import("@/routes/Entities").then((module) => ({
  default: module.Entities
})));
export const EntityDetailPage = lazy(() => import("@/pages/EntityDetail").then((module) => ({
  default: module.EntityDetailPage
})));
export const Home = lazy(() => import("@/routes/Home").then((module) => ({
  default: module.Home
})));
export const Inbox = lazy(() => import("@/routes/Inbox").then((module) => ({
  default: module.Inbox
})));
export const LifeGraphPage = lazy(() => import("@/pages/LifeGraph").then((module) => ({
  default: module.LifeGraphPage
})));
export const Memory = lazy(() => import("@/routes/Memory").then((module) => ({
  default: module.Memory
})));
export const RelationshipReviewPage = lazy(() => import("@/pages/RelationshipReview").then((module) => ({
  default: module.RelationshipReviewPage
})));
export const Settings = lazy(() => import("@/routes/Settings").then((module) => ({
  default: module.Settings
})));
