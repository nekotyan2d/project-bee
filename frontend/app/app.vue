<template>
    <div>
        <VitePwaManifest />
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage :keepalive="{ include: ['index', 'analytics', 'colonies-id'] }" />
        </NuxtLayout>
    </div>
</template>
