/** Firestore Admin adapter for the isolated consent-cleanup function.
 * Kept dependency-injected so tests assert batch/precondition behavior without
 * requiring credentials, a Firebase project, or network access.
 */
export function makeFirestoreCleanupAdapter(db, FieldPath) {
  return {
    async scan(uid, cursor, pageSize) {
      let q = db.collection('student_links')
        .where('studentId', '==', uid)
        .orderBy(FieldPath.documentId())
        .limit(pageSize);
      if (cursor) q = q.startAfter(cursor);
      const result = await q.get();
      return {
        links: result.docs.map(s => ({ id:s.id, data:s.data(), snapshot:s })),
        nextCursor: result.docs.at(-1) ?? null,
      };
    },
    async deletePair(link) {
      const snapshot = link.snapshot;
      if (!snapshot?.exists || !snapshot.updateTime) throw new Error('CP28_STALE_LINK_SNAPSHOT');
      const reportRef = db.collection('student_shared_reports').doc(link.id);
      const report = await reportRef.get();
      const batch = db.batch();
      if (report.exists) {
        if (report.data()?.studentId !== link.data.studentId
          || report.data()?.viewerId !== link.data.viewerId
          || report.data()?.viewerRole !== link.data.viewerRole) {
          throw new Error('CP28_REPORT_LINEAGE_MISMATCH');
        }
        if (!report.updateTime) throw new Error('CP28_STALE_REPORT_SNAPSHOT');
        batch.delete(reportRef, { lastUpdateTime:report.updateTime });
      }
      batch.delete(snapshot.ref, { lastUpdateTime:snapshot.updateTime });
      await batch.commit();
    },
  };
}
