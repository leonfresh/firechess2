import {ActivityCollection} from '../collection';
import {HubPage} from '../hub-page';
export default function ShopPage() {
  return <HubPage active="shop"><ActivityCollection page shopEntry /></HubPage>;
}
