import { type Product } from './model';
import { guideFor } from './product-guidance';
// Reviewed retailer listings, no referral codes. Sizes and availability are checked by the user on arrival.
const links: Record<string,string> = {
 centella:'skin1004-madagascar-centella-ampoule-55ml/info.html/pid.1121970671',
 hyalu:'skin1004-madagascar/info.html/pid.1113888108',
 eye:'skin-1004-madagascar-centella-probio-cica-bakuchiol-eye-cream-20-ml/info.html/pid.1124363690',
 niacinamide:'skin1004-lab-in-nature-madagascar-centella-niacinamide-10-boosting/info.html/pid.1134538837',
 mask:'skin-1004-madagascar-centella-poremizing-quick-clay-stick-mask-27g/info.html/pid.1123474314',
 brightpad:'skin1004-madagascar-centella-tone-brightening-dark-spot-ampoule-pad/info.html/pid.1135889572',
 porepad:'medicube-zero-pore-pad-2-0/info.html/pid.1124067239',
 vitac:'medicube-deep-vita-c-capsule-cream-55g/info.html/pid.1129945243',
 boj:'beauty-of-joseon-relief-sun-50ml/info.html/pid.1107744417',
 mist:'skin1004-madagascar-centella-hyalu-cica-cloudy-mist-gesichtsspray/info.html/pid.1107199857',
 roundlab:'round-lab-1025-dokdo-cleanser-150ml/info.html/pid.1074113181',
 oil:'skin1004-madagascar-centella-light-cleansing-oil-200ml/info.html/pid.1077182361',
 foam:'skin-1004-madagascar-centella-ampoule-foam-125ml/info.html/pid.1077182367',
 drg:'dr-g-r-e-d-blemish-clear-soothing-cream-tube-type-70ml/info.html/pid.1132917385',
 avene:'avene-hydrance-light-hydrating-emulsion-40ml/info.html/pid.1131917358',
};
export function shoppingLink(p: Product): string | undefined {
 if(p.rebuyUrl && /^https:\/\/(www\.)?yesstyle\.com\//.test(p.rebuyUrl)) return p.rebuyUrl;
 const key=guideFor(p)?.key;return key && links[key] ? `https://www.yesstyle.com/en/${links[key]}` : undefined;
}
