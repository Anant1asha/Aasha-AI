export function compareVersions(localVersion,serverVersion){return localVersion===serverVersion?'equal':localVersion<serverVersion?'server_newer':'local_newer';}
export function resolveConflict(local,server){if(local.eventId!==server.eventId)throw new Error('conflict requires same eventId');return {eventId:local.eventId,resolution:'append-only-both',canonical:[local,server]};}
