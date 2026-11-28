import AnimatedProjectPreview from './AnimatedProjectPreview';

const BASE = '/previews/lloyds/digital-banking-testing';

const ALT = 'Animated illustrative reconstruction of a digital banking testing workflow on a fictional banking app: a Git feature branch and commit, a Jenkins pipeline, a failing frontend test, defect investigation in browser DevTools, a debugged and corrected sort-code pattern, passing regression tests and a final "Release Ready — All Checks Passed" status.';

export default function DigitalBankingTestingPreview() {
  return (
    <>
      <AnimatedProjectPreview
        alt={ALT}
        sources={{ webm: `${BASE}.webm`, mp4: `${BASE}.mp4`, gif: `${BASE}.gif`, poster: `${BASE}-poster.webp` }}
      />
      <p className="pv-note">Illustrative reconstruction for portfolio purposes: a fictional banking app with synthetic data. It is not actual historical Lloyds Banking Group engineering footage and shows no internal systems, code or customer information.</p>
    </>
  );
}
