const db = require('../db')
const {sqlForPartialUpdate} = require('../helpers/sql')

class Job{
    static async create(data){
        const result = await db.query(
            `INSERT INTO jobs(title, salary, equity, company_handle)
            VALUES($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS companyHandle`,
            [data.title, data.salary, data.equity, data.companyHandle]
        )
        return result.rows[0]
    }

    static async findAll({minSalary, hasEquity, title} = {}){
        let jobsRes = 
        `SELECT j.id, j.title, j.salary, j.equity, j.company_handle as "companyHandle", c.name as "companyName"
        FROM jobs j LEFT join companies AS c ON c.handle = j.company_handle`

        let vals = []
        let expressions = []

        if(minSalary !== undefined){
            vals.push(minSalary)
            expressions.push(`salary >= $${vals.length}`)
        }
        if(hasEquity === true){
            expressions.push('equity > 0')
        }
        if(title !== undefined){
            vals.push(`%${title}%`)
            expressions.push(`title ILIKE $${vals.length}`)
        }
        if(expressions.length > 0){
            jobsRes += ` WHERE ` + expressions.join(' AND ')
        }
        jobsRes += 'ORDER BY title'

        const result = await db.query(jobsRes,vals);
        return result.rows
    }

    static async get(id){
        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS 'companyHandle'
            FROM jobs
            WHERE id=$1`, [id]
        )
        const job = jobRes.rows[0]
        const compRes = await db.query(
            `SELECT handle, name, description, num_employees AS 'numEmployees', logo_url AS 'logoUrl'
            FROM companies 
            WHERE handle=$1`, [job.companyHandle]
        )
        delete job.companyHandle;
        job.company = compRes.rows[0]
        return job
    }

    static async update(id, data){
        const {setCols, vals} = sqlForPartialUpdate(data,{})
        const valId = '$' + (vals.length + 1)
        
        const jobsRes = `UPDATE jobs SET ${setCols} WHERE id=${valId} 
                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`
        const result = await db.query(jobsRes, [...vals, id])
        return result.rows[0]
    }

    static async remove(id){
        const result = await db.query(`DELETE FROM jobs WHERE id=$1 RETURNING id`, [id])
    }
}

module.exports = Job;

