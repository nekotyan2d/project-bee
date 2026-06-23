<template>
    <div>
        <NuxtPwaAssets />
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage :keepalive="{ include: ['index', 'analytics', 'colonies-id'] }" />
        </NuxtLayout>
    </div>
</template>
