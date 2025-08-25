"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Clock, Calendar } from "lucide-react";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  status: "completed" | "current" | "upcoming";
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const getStatusIcon = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 text-white" />;
      case "current":
        return <Clock className="h-3 w-3 text-white" />;
      case "upcoming":
        return <Circle className="h-3 w-3 text-white" />;
    }
  };

  const getStatusColor = (status: TimelineEvent["status"]) => {
    switch (status) {
      case "completed":
        return "bg-slate-600";
      case "current":
        return "bg-orange-500";
      case "upcoming":
        return "bg-slate-400";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Timeline Header */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Calendar className="h-5 w-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">Awards Timeline 2026</h3>
      </div>

      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-slate-200" />
          
          <div className="flex justify-center items-start gap-8 px-4">
            {events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center relative flex-1 max-w-[180px]"
              >
                {/* Status Icon */}
                <motion.div
                  className={`flex items-center justify-center w-6 h-6 rounded-full shadow-sm mb-2 relative z-10 ${getStatusColor(event.status)}`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {getStatusIcon(event.status)}
                </motion.div>

                {/* Content Card */}
                <motion.div
                  className={`bg-white rounded-lg border p-4 shadow-sm w-full ${
                    event.status === "current" 
                      ? "border-orange-200 bg-orange-50" 
                      : "border-slate-200"
                  }`}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-medium text-orange-600 mb-3">
                    {event.date}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 leading-tight">
                    {event.title}
                  </h4>
                  
                  {event.status === "current" && (
                    <motion.div
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      Active
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Timeline */}
      <div className="md:hidden space-y-4 px-4">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-start gap-4"
          >
            {/* Status Icon with Line */}
            <div className="flex flex-col items-center">
              <motion.div
                className={`flex items-center justify-center w-6 h-6 rounded-full shadow-sm ${getStatusColor(event.status)}`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {getStatusIcon(event.status)}
              </motion.div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-8 bg-slate-200 mt-1" />
              )}
            </div>

            {/* Content */}
            <motion.div
              className={`flex-1 bg-white rounded-lg border p-3 shadow-sm ${
                event.status === "current" 
                  ? "border-orange-200 bg-orange-50" 
                  : "border-slate-200"
              }`}
              whileHover={{ x: 2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-sm font-medium text-orange-600 mb-2">
                {event.date}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">
                {event.title}
              </h4>
              
              {event.status === "current" && (
                <motion.div
                  className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  Active
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}