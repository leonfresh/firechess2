import {ChaosWatch} from '@/components/chaos-watch';
export default async function ReplayPage({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ChaosWatch initialMatch={id}/>;}
