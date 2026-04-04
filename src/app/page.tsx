'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const AppShell = dynamic(() => import('@/components/fintrack/AppShell'), { ssr: false });

export default function HomePage() {
  return <AppShell />;
}
