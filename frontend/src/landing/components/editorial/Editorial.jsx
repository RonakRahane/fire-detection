import CaptureSection from '@/landing/components/sections/CaptureSection';
import DetectSection from '@/landing/components/sections/DetectSection';
import Introduction from '@/landing/components/sections/Introduction';
import VerifySection from '@/landing/components/sections/VerifySection';
import { chapters } from '@/landing/lib/site';
import ContentsNav from './ContentsNav';

const CONTENTS = [...chapters, { id: 'try', index: 'Get Started' }];

export default function Editorial() {
  return (
    <div className="relative bg-[#faf9f5] text-slate-950">
      <div className="mx-auto max-w-[1400px] px-[clamp(18px,4.4vw,64px)]">
        <div className="grid grid-cols-[240px_minmax(0,700px)_minmax(0,1fr)] gap-12 max-[1100px]:grid-cols-[180px_minmax(0,1fr)] max-[1100px]:gap-10 max-[860px]:block">
          <aside className="pt-[104px] max-[860px]:hidden">
            <div className="sticky top-[104px]">
              <ContentsNav items={CONTENTS} />
            </div>
          </aside>

          <article className="min-w-0 pt-24 pb-[150px] max-[860px]:pt-[72px] max-[860px]:pb-[104px]">
            <Introduction />
            <DetectSection />
            <VerifySection />
            <CaptureSection />
          </article>
        </div>
      </div>
    </div>
  );
}
