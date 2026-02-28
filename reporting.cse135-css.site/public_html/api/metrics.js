// GET ALL METRICS

router.get('/', async (req, res) => {
    try {
        const { type, session } = req.query;

        let query = 'SELECT * FROM metric_logs';
        const params = [];
        const conditions = [];

        if (type) {
            conditions.push('event_type = ?');
            params.push(type);
        }

        if (session) {
            conditions.push('session_id = ?');
            params.push(session);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY server_timestamp DESC';

        const [rows] = await pool.execute(query, params);
        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET BY ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM metric_logs WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0)
            return res.status(404).json({ error: 'Not found' });

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const {
            session_id,
            event_type,
            page_url,
            page_title,
            referrer,
            client_timestamp,
            event_data
        } = req.body;

        const ip =
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress;

        const [result] = await pool.execute(
            `INSERT INTO metric_logs
            (session_id, event_type, page_url, page_title, referrer, client_timestamp, event_data, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                session_id,
                event_type,
                page_url,
                page_title,
                referrer,
                client_timestamp,
                JSON.stringify(event_data),
                ip
            ]
        );

        res.status(201).json({
            message: 'Inserted successfully',
            id: result.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Insert failed' });
    }
});

//PUT
router.put('/:id', async (req, res) => {
    try {
        const { event_type, event_data } = req.body;

        const [result] = await pool.execute(
            `UPDATE metric_logs
             SET event_type = ?, event_data = ?
             WHERE id = ?`,
            [
                event_type,
                JSON.stringify(event_data),
                req.params.id
            ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Not found' });

        res.json({ message: 'Updated successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM metric_logs WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Not found' });

        res.json({ message: 'Deleted successfully' });

    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;