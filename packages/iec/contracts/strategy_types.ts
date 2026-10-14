/**
 * AASHA AIOS — IEC Strategy and Provider Types
 * Path: Aasha-AI/packages/iec/contracts/strategy_types.ts
 *
 * Enforces clean separation between provider classifications and implementation strategies.
 */

export type ProviderClass =
  | 'AASHA_NATIVE'
  | 'AASHA_REUSABLE_RESOURCE'
  | 'AASHA_FOUNDATION'
  | 'APPROVED_OPEN_SOURCE'
  | 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER'
  | 'NEW_GENERATED_CAPABILITY';

export type ImplementationStrategy =
  | 'REUSE'
  | 'ADAPT'
  | 'COMPOSE'
  | 'GENERATE';

export type SearchSource =
  | 'EXISTING_AASHA_EXPERIENCE'
  | 'APPROVED_AASHA_REUSABLE_RESOURCE'
  | 'APPROVED_AASHA_FOUNDATION'
  | 'APPROVED_EXTERNAL_RESOURCE'
  | 'APPROVED_EXTERNAL_CAPABILITY_PROVIDER'
  | 'NEW_AASHA_NATIVE_CAPABILITY';

export interface PerformanceBudget {
  maxBundleBytes: number;
  targetFps?: number;
  pauseWhenHidden: boolean;
  memoryCeilingMb?: number;
}

export interface DeviceRequirements {
  supportedViewports: number[]; // e.g. [320, 375, 414, 768]
  minTouchTargetPx: number;      // Must be >= 44
  orientationSafe: boolean;
}

export interface ChildRuntimeNetworkPolicy {
  readonly learningExecutionRequiresNetwork: false;
  readonly coreLearningAssetsRequireNetwork: false;
  readonly runtimeCdnDependency: false;
  readonly remoteFontDependency: false;
  readonly telemetrySyncAllowed: true;
}
