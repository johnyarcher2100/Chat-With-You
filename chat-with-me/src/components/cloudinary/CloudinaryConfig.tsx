'use client';

import { CloudinaryContext } from 'cloudinary-react';
import { CLOUDINARY_CLOUD_NAME } from '@/config/env';

interface CloudinaryConfigProps {
  children: React.ReactNode;
}

export default function CloudinaryConfig({ children }: CloudinaryConfigProps) {
  return (
    <CloudinaryContext cloudName={CLOUDINARY_CLOUD_NAME}>
      {children}
    </CloudinaryContext>
  );
}
