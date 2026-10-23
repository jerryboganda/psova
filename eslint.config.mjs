import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    files: ['components/three/PakistanMap.tsx', 'components/three/VesselNetwork.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: ['lib/hooks.ts'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: [
      'components/registry/AdminAudit.tsx',
      'components/registry/AdminClinicians.tsx',
      'components/registry/AdminRecordDetail.tsx',
      'components/registry/AdminRecordsBrowser.tsx',
      'components/registry/MyCasesTable.tsx',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['components/registry/ClinicianCaseWizard.tsx', 'components/registry/EnrollWizard.tsx'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'apps/mobile/dist/**',
    'public/vendor/**',
  ]),
]);
